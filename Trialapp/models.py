from django.db import models


class Player(models.Model):
    player_id = models.CharField(max_length=50, unique=True)
    name = models.CharField(max_length=100)
    pos = models.CharField(max_length=20, blank=True)
    ht_in_in = models.IntegerField(null=True, blank=True)
    wt = models.IntegerField(null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    colleges = models.CharField(max_length=200, blank=True)
    from_year = models.IntegerField(null=True, blank=True)
    to_year = models.IntegerField(null=True, blank=True)
    debut = models.DateTimeField(null=True, blank=True)
    hof = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class PlayerSeason(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='seasons')
    season = models.IntegerField()
    lg = models.CharField(max_length=20, blank=True)
    age = models.IntegerField(null=True, blank=True)
    team = models.CharField(max_length=50, blank=True)
    pos = models.CharField(max_length=20, blank=True)
    experience = models.IntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.season}"


class PlayerPerGameStat(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='per_game_stats')
    season = models.IntegerField()
    team = models.CharField(max_length=50, blank=True)
    pos = models.CharField(max_length=20, blank=True)
    g = models.IntegerField(null=True, blank=True)
    gs = models.IntegerField(null=True, blank=True)
    mp_per_game = models.FloatField(null=True, blank=True)
    fg_per_game = models.FloatField(null=True, blank=True)
    fga_per_game = models.FloatField(null=True, blank=True)
    fg_percent = models.FloatField(null=True, blank=True)
    x3p_per_game = models.FloatField(null=True, blank=True)
    x3pa_per_game = models.FloatField(null=True, blank=True)
    x3p_percent = models.FloatField(null=True, blank=True)
    x2p_per_game = models.FloatField(null=True, blank=True)
    x2pa_per_game = models.FloatField(null=True, blank=True)
    x2p_percent = models.FloatField(null=True, blank=True)
    ft_per_game = models.FloatField(null=True, blank=True)
    fta_per_game = models.FloatField(null=True, blank=True)
    ft_percent = models.FloatField(null=True, blank=True)
    orb_per_game = models.FloatField(null=True, blank=True)
    drb_per_game = models.FloatField(null=True, blank=True)
    trb_per_game = models.FloatField(null=True, blank=True)
    ast_per_game = models.FloatField(null=True, blank=True)
    stl_per_game = models.FloatField(null=True, blank=True)
    blk_per_game = models.FloatField(null=True, blank=True)
    tov_per_game = models.FloatField(null=True, blank=True)
    pf_per_game = models.FloatField(null=True, blank=True)
    pts_per_game = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.season}"


class PlayerShootingStat(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='shooting_stats')
    season = models.IntegerField()
    team = models.CharField(max_length=50, blank=True)
    pos = models.CharField(max_length=20, blank=True)
    fg_percent = models.FloatField(null=True, blank=True)
    x3p_percent = models.FloatField(null=True, blank=True)
    x2p_percent = models.FloatField(null=True, blank=True)
    e_fg_percent = models.FloatField(null=True, blank=True)
    ft_percent = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.season}"


class PlayerTotalsStat(models.Model):
    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name='totals_stats')
    season = models.IntegerField()
    team = models.CharField(max_length=50, blank=True)
    pos = models.CharField(max_length=20, blank=True)
    g = models.IntegerField(null=True, blank=True)
    gs = models.IntegerField(null=True, blank=True)
    mp = models.FloatField(null=True, blank=True)
    fg = models.FloatField(null=True, blank=True)
    fga = models.FloatField(null=True, blank=True)
    fg_percent = models.FloatField(null=True, blank=True)
    x3p = models.FloatField(null=True, blank=True)
    x3pa = models.FloatField(null=True, blank=True)
    x3p_percent = models.FloatField(null=True, blank=True)
    x2p = models.FloatField(null=True, blank=True)
    x2pa = models.FloatField(null=True, blank=True)
    x2p_percent = models.FloatField(null=True, blank=True)
    ft = models.FloatField(null=True, blank=True)
    fta = models.FloatField(null=True, blank=True)
    ft_percent = models.FloatField(null=True, blank=True)
    orb = models.FloatField(null=True, blank=True)
    drb = models.FloatField(null=True, blank=True)
    trb = models.FloatField(null=True, blank=True)
    ast = models.FloatField(null=True, blank=True)
    stl = models.FloatField(null=True, blank=True)
    blk = models.FloatField(null=True, blank=True)
    tov = models.FloatField(null=True, blank=True)
    pf = models.FloatField(null=True, blank=True)
    pts = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.player.name} - {self.season}"

